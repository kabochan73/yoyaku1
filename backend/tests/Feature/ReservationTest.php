<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    // =========================================
    // 空き状況確認（認証不要）
    // =========================================

    public function test_availability_returns_reservations_for_date(): void
    {
        // Arrange: 特定日の予約を作成
        Reservation::factory()->create([
            'start_datetime' => '2026-07-01 10:00:00',
            'end_datetime'   => '2026-07-01 12:00:00',
            'status'         => 'confirmed',
        ]);

        // 別日の予約は返ってきてはいけない
        Reservation::factory()->create([
            'start_datetime' => '2026-07-02 10:00:00',
            'end_datetime'   => '2026-07-02 12:00:00',
        ]);

        // Act & Assert: 指定日の予約のみ 1件返る
        $this->getJson('/api/reservations/availability?date=2026-07-01')
             ->assertStatus(200)
             ->assertJsonCount(1);
    }

    public function test_availability_excludes_cancelled_reservations(): void
    {
        // キャンセル済みは空きとして扱うので返ってこない
        Reservation::factory()->create([
            'start_datetime' => '2026-07-01 10:00:00',
            'end_datetime'   => '2026-07-01 12:00:00',
            'status'         => 'cancelled',
        ]);

        $this->getJson('/api/reservations/availability?date=2026-07-01')
             ->assertStatus(200)
             ->assertJsonCount(0);
    }

    public function test_availability_requires_date(): void
    {
        // date パラメーターなしは 422
        $this->getJson('/api/reservations/availability')
             ->assertStatus(422);
    }

    // =========================================
    // マイページ：自分の予約一覧
    // =========================================

    public function test_index_returns_only_my_reservations(): void
    {
        $user  = User::factory()->create();
        $other = User::factory()->create();

        // 自分の予約 1件 + 他人の予約 1件
        Reservation::factory()->create(['user_id' => $user->id]);
        Reservation::factory()->create(['user_id' => $other->id]);

        Sanctum::actingAs($user);

        // 自分の予約だけ 1件返る
        $this->getJson('/api/reservations')
             ->assertStatus(200)
             ->assertJsonCount(1);
    }

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/reservations')
             ->assertStatus(401);
    }

    // =========================================
    // 予約作成
    // =========================================

    public function test_store_creates_reservation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/reservations', [
            'start_datetime' => now()->addDay()->setTime(10, 0)->format('Y-m-d H:i:s'),
            'end_datetime'   => now()->addDay()->setTime(12, 0)->format('Y-m-d H:i:s'),
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('reservations', ['user_id' => $user->id]);
    }

    public function test_store_fails_when_time_conflicts(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // 10:00〜12:00 の予約をあらかじめ作成
        Reservation::factory()->create([
            'start_datetime' => now()->addDay()->setTime(10, 0)->format('Y-m-d H:i:s'),
            'end_datetime'   => now()->addDay()->setTime(12, 0)->format('Y-m-d H:i:s'),
            'status'         => 'confirmed',
        ]);

        // 11:00〜13:00 は重複しているので 422
        $this->postJson('/api/reservations', [
            'start_datetime' => now()->addDay()->setTime(11, 0)->format('Y-m-d H:i:s'),
            'end_datetime'   => now()->addDay()->setTime(13, 0)->format('Y-m-d H:i:s'),
        ])->assertStatus(422);
    }

    public function test_store_fails_with_past_datetime(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // 過去日時は 422
        $this->postJson('/api/reservations', [
            'start_datetime' => now()->subDay()->format('Y-m-d H:i:s'),
            'end_datetime'   => now()->subDay()->addHours(2)->format('Y-m-d H:i:s'),
        ])->assertStatus(422);
    }

    // =========================================
    // 予約変更
    // =========================================

    public function test_update_reservation(): void
    {
        $user        = User::factory()->create();
        $reservation = Reservation::factory()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $newStart = now()->addDays(5)->setTime(14, 0)->format('Y-m-d H:i:s');
        $newEnd   = now()->addDays(5)->setTime(16, 0)->format('Y-m-d H:i:s');

        $this->putJson("/api/reservations/{$reservation->id}", [
            'start_datetime' => $newStart,
            'end_datetime'   => $newEnd,
        ])->assertStatus(200);

        $this->assertDatabaseHas('reservations', [
            'id'             => $reservation->id,
            'start_datetime' => $newStart,
        ]);
    }

    public function test_update_fails_for_other_users_reservation(): void
    {
        $user        = User::factory()->create();
        $other       = User::factory()->create();
        $reservation = Reservation::factory()->create(['user_id' => $other->id]);

        Sanctum::actingAs($user);

        // 他人の予約は変更できない → 403
        $this->putJson("/api/reservations/{$reservation->id}", [
            'start_datetime' => now()->addDays(5)->setTime(14, 0)->format('Y-m-d H:i:s'),
            'end_datetime'   => now()->addDays(5)->setTime(16, 0)->format('Y-m-d H:i:s'),
        ])->assertStatus(403);
    }

    // =========================================
    // キャンセル
    // =========================================

    public function test_cancel_reservation(): void
    {
        $user        = User::factory()->create();
        $reservation = Reservation::factory()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/reservations/{$reservation->id}/cancel")
             ->assertStatus(200);

        // DBの status が cancelled になっているか確認
        $this->assertDatabaseHas('reservations', [
            'id'     => $reservation->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_cancel_fails_for_other_users_reservation(): void
    {
        $user        = User::factory()->create();
        $other       = User::factory()->create();
        $reservation = Reservation::factory()->create(['user_id' => $other->id]);

        Sanctum::actingAs($user);

        // 他人の予約はキャンセルできない → 403
        $this->patchJson("/api/reservations/{$reservation->id}/cancel")
             ->assertStatus(403);
    }
}
