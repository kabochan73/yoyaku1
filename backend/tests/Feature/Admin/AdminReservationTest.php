<?php

namespace Tests\Feature\Admin;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReservationTest extends TestCase
{
    use RefreshDatabase;

    // テスト内で繰り返し使う「管理者ユーザーを作成してログイン」を
    // ヘルパーメソッドにまとめた。DRY（繰り返しを避ける）の原則。
    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    // =========================================
    // アクセス制御（全エンドポイント共通の確認）
    // =========================================

    public function test_admin_routes_require_authentication(): void
    {
        // 未ログインは 401
        $this->getJson('/api/admin/reservations')->assertStatus(401);
    }

    public function test_admin_routes_reject_non_admin_users(): void
    {
        // 一般ユーザーは 403
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $this->getJson('/api/admin/reservations')->assertStatus(403);
    }

    // =========================================
    // 予約一覧
    // =========================================

    public function test_index_returns_all_reservations(): void
    {
        $this->actingAsAdmin();

        Reservation::factory()->count(3)->create();

        $this->getJson('/api/admin/reservations')
             ->assertStatus(200)
             ->assertJsonCount(3);
    }

    public function test_index_filters_by_date(): void
    {
        $this->actingAsAdmin();

        Reservation::factory()->create([
            'start_datetime' => '2026-07-01 10:00:00',
            'end_datetime'   => '2026-07-01 12:00:00',
        ]);
        Reservation::factory()->create([
            'start_datetime' => '2026-07-02 10:00:00',
            'end_datetime'   => '2026-07-02 12:00:00',
        ]);

        // date パラメーターで絞り込み
        $this->getJson('/api/admin/reservations?date=2026-07-01')
             ->assertStatus(200)
             ->assertJsonCount(1);
    }

    // =========================================
    // 管理者による予約作成（電話対応）
    // =========================================

    public function test_store_creates_reservation_by_admin(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/reservations', [
            'start_datetime' => '2026-07-10 10:00:00',
            'end_datetime'   => '2026-07-10 12:00:00',
            'customer_name'  => '山田太郎',
            'customer_phone' => '090-1234-5678',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('reservations', [
            'customer_name'     => '山田太郎',
            'reserved_by_admin' => true, // 管理者予約フラグが立つ
        ]);
    }

    public function test_store_requires_customer_name_and_phone(): void
    {
        $this->actingAsAdmin();

        // customer_name と customer_phone は必須
        $this->postJson('/api/admin/reservations', [
            'start_datetime' => '2026-07-10 10:00:00',
            'end_datetime'   => '2026-07-10 12:00:00',
        ])->assertStatus(422);
    }

    public function test_store_fails_when_time_conflicts(): void
    {
        $this->actingAsAdmin();

        Reservation::factory()->create([
            'start_datetime' => '2026-07-10 10:00:00',
            'end_datetime'   => '2026-07-10 12:00:00',
            'status'         => 'confirmed',
        ]);

        $this->postJson('/api/admin/reservations', [
            'start_datetime' => '2026-07-10 11:00:00',
            'end_datetime'   => '2026-07-10 13:00:00',
            'customer_name'  => '田中花子',
            'customer_phone' => '080-0000-0000',
        ])->assertStatus(422);
    }

    // =========================================
    // 管理者による予約変更
    // =========================================

    public function test_update_reservation(): void
    {
        $this->actingAsAdmin();
        $reservation = Reservation::factory()->create();

        $this->putJson("/api/admin/reservations/{$reservation->id}", [
            'start_datetime' => '2026-08-01 14:00:00',
            'end_datetime'   => '2026-08-01 16:00:00',
        ])->assertStatus(200);

        $this->assertDatabaseHas('reservations', [
            'id'             => $reservation->id,
            'start_datetime' => '2026-08-01 14:00:00',
        ]);
    }

    // =========================================
    // 管理者によるキャンセル
    // =========================================

    public function test_cancel_any_reservation(): void
    {
        $this->actingAsAdmin();

        // 管理者はどのユーザーの予約でもキャンセル可能
        $reservation = Reservation::factory()->create();

        $this->patchJson("/api/admin/reservations/{$reservation->id}/cancel")
             ->assertStatus(200);

        $this->assertDatabaseHas('reservations', [
            'id'     => $reservation->id,
            'status' => 'cancelled',
        ]);
    }
}
