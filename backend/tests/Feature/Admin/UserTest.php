<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    public function test_index_returns_non_admin_users_only(): void
    {
        $this->actingAsAdmin();

        // 一般ユーザーを 3人作成
        User::factory()->count(3)->create(['is_admin' => false]);

        // 管理者ユーザーを追加で 1人作成（一覧には出ないはず）
        User::factory()->create(['is_admin' => true]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);

        // 管理者は除外されるので 3人（actingAsAdmin の管理者は含まない）
        // actingAsAdmin で作った管理者 + 追加管理者 1人 = 合計 2人の管理者は除外
        // 返るのは一般ユーザー 3人のみ
        $response->assertJsonCount(3);
    }

    public function test_index_includes_reservation_count(): void
    {
        $this->actingAsAdmin();

        $user = User::factory()->create(['is_admin' => false]);

        $response = $this->getJson('/api/admin/users');

        // withCount('reservations') で reservations_count が含まれる
        $response->assertStatus(200)
                 ->assertJsonFragment(['reservations_count' => 0]);
    }

    public function test_index_requires_admin(): void
    {
        // 未ログイン
        $this->getJson('/api/admin/users')->assertStatus(401);
    }

    public function test_index_rejects_non_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));

        $this->getJson('/api/admin/users')->assertStatus(403);
    }
}
