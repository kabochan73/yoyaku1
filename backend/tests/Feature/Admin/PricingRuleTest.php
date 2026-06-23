<?php

namespace Tests\Feature\Admin;

use App\Models\PricingRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PricingRuleTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    // =========================================
    // 料金一覧（認証不要）
    // =========================================

    public function test_index_returns_pricing_rules(): void
    {
        PricingRule::factory()->count(3)->create();

        // GET /api/pricing-rules は認証不要（フロントのカレンダー表示用）
        $this->getJson('/api/pricing-rules')
             ->assertStatus(200)
             ->assertJsonCount(3);
    }

    // =========================================
    // 料金追加（管理者のみ）
    // =========================================

    public function test_store_creates_pricing_rule(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/pricing-rules', [
            'name'           => '平日昼間料金',
            'day_type'       => 'weekday',
            'start_time'     => '09:00',
            'end_time'       => '17:00',
            'price_per_hour' => 3000,
            'is_active'      => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('pricing_rules', ['name' => '平日昼間料金']);
    }

    public function test_store_validates_day_type(): void
    {
        $this->actingAsAdmin();

        // day_type は weekday/weekend/holiday 以外は 422
        $this->postJson('/api/admin/pricing-rules', [
            'name'           => 'テスト料金',
            'day_type'       => 'invalid_type',
            'start_time'     => '09:00',
            'end_time'       => '17:00',
            'price_per_hour' => 3000,
        ])->assertStatus(422);
    }

    public function test_store_requires_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));

        $this->postJson('/api/admin/pricing-rules', [])->assertStatus(403);
    }

    // =========================================
    // 料金更新
    // =========================================

    public function test_update_pricing_rule(): void
    {
        $this->actingAsAdmin();
        $rule = PricingRule::factory()->create();

        $this->putJson("/api/admin/pricing-rules/{$rule->id}", [
            'name'           => '更新後の料金名',
            'day_type'       => 'weekend',
            'start_time'     => '10:00',
            'end_time'       => '18:00',
            'price_per_hour' => 5000,
            'is_active'      => true,
        ])->assertStatus(200);

        $this->assertDatabaseHas('pricing_rules', [
            'id'             => $rule->id,
            'name'           => '更新後の料金名',
            'price_per_hour' => 5000,
        ]);
    }

    // =========================================
    // 料金削除
    // =========================================

    public function test_destroy_pricing_rule(): void
    {
        $this->actingAsAdmin();
        $rule = PricingRule::factory()->create();

        $this->deleteJson("/api/admin/pricing-rules/{$rule->id}")
             ->assertStatus(200);

        // DBから消えているか確認
        $this->assertDatabaseMissing('pricing_rules', ['id' => $rule->id]);
    }
}
