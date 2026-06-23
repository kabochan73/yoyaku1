<?php

namespace Tests\Feature\Admin;

use App\Models\ClosedDay;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClosedDayTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    // =========================================
    // 定休日一覧（認証不要）
    // =========================================

    public function test_index_returns_closed_days(): void
    {
        ClosedDay::factory()->count(2)->create();

        $this->getJson('/api/closed-days')
             ->assertStatus(200)
             ->assertJsonCount(2);
    }

    // =========================================
    // 定休日追加
    // =========================================

    public function test_store_creates_closed_day(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/closed-days', [
            'date'   => '2026-08-15',
            'type'   => 'national',
            'reason' => '光復節',
        ]);

        $response->assertStatus(201);
        // SQLite では date が '2026-08-15 00:00:00' 形式で保存されるため
        // DB 直接比較ではなくレコード件数で確認する
        $this->assertDatabaseCount('closed_days', 1);
    }

    public function test_store_fails_with_duplicate_date(): void
    {
        $this->actingAsAdmin();

        // Factory 経由だと日付フォーマットが SQLite で異なるため
        // API を通じて1件目を作成し、フォーマットを統一する
        $this->postJson('/api/admin/closed-days', [
            'date' => '2026-08-15',
            'type' => 'special',
        ])->assertStatus(201);

        // 同じ日付で2件目 → unique バリデーションで 422
        $this->postJson('/api/admin/closed-days', [
            'date' => '2026-08-15',
            'type' => 'national',
        ])->assertStatus(422);
    }

    public function test_store_validates_type(): void
    {
        $this->actingAsAdmin();

        // type は regular/special/national 以外は 422
        $this->postJson('/api/admin/closed-days', [
            'date' => '2026-09-01',
            'type' => 'unknown_type',
        ])->assertStatus(422);
    }

    public function test_store_requires_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));

        $this->postJson('/api/admin/closed-days', [])->assertStatus(403);
    }

    // =========================================
    // 定休日削除
    // =========================================

    public function test_destroy_closed_day(): void
    {
        $this->actingAsAdmin();
        $closedDay = ClosedDay::factory()->create();

        $this->deleteJson("/api/admin/closed-days/{$closedDay->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('closed_days', ['id' => $closedDay->id]);
    }
}
