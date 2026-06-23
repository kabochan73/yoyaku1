<?php

namespace Tests\Feature\Admin;

use App\Models\BusinessSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BusinessSettingTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    // =========================================
    // 営業設定取得（認証不要）
    // =========================================

    public function test_index_returns_settings(): void
    {
        // key-value 形式でDBに保存されている設定を取得
        BusinessSetting::set('opening_time', '09:00');
        BusinessSetting::set('closing_time', '21:00');

        $response = $this->getJson('/api/business-settings');

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'opening_time' => '09:00',
                     'closing_time' => '21:00',
                 ]);
    }

    // =========================================
    // 営業設定更新（管理者のみ）
    // =========================================

    public function test_update_settings(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/business-settings', [
            'opening_time' => '08:00',
            'closing_time' => '22:00',
            'slot_minutes' => 60,
        ])->assertStatus(200);

        // DB に反映されているか確認
        $this->assertEquals('08:00', BusinessSetting::get('opening_time'));
        $this->assertEquals('22:00', BusinessSetting::get('closing_time'));
    }

    public function test_update_fails_when_closing_before_opening(): void
    {
        $this->actingAsAdmin();

        // 閉店時間が開店時間より前は 422
        $this->putJson('/api/admin/business-settings', [
            'opening_time' => '22:00',
            'closing_time' => '08:00',
            'slot_minutes' => 60,
        ])->assertStatus(422);
    }

    public function test_update_validates_slot_minutes(): void
    {
        $this->actingAsAdmin();

        // slot_minutes は 30/60/90/120 のみ許可
        $this->putJson('/api/admin/business-settings', [
            'opening_time' => '09:00',
            'closing_time' => '21:00',
            'slot_minutes' => 45,
        ])->assertStatus(422);
    }

    public function test_update_requires_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));

        $this->putJson('/api/admin/business-settings', [])->assertStatus(403);
    }
}
