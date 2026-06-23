<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// NOTE: SalesController は EXTRACT() という PostgreSQL 専用の SQL を使っているため、
// SQLite (テスト用 DB) では実際のデータ取得のテストができない。
// ここではアクセス制御（認証・管理者チェック）のみ確認する。
// データの正確性テストは PostgreSQL を使う環境で別途追加する。
class SalesTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => true]));
    }

    // =========================================
    // 月別売上
    // =========================================

    public function test_monthly_requires_admin(): void
    {
        // 未ログインは 401
        $this->getJson('/api/admin/sales/monthly')->assertStatus(401);
    }

    public function test_monthly_rejects_non_admin(): void
    {
        Sanctum::actingAs(User::factory()->create(['is_admin' => false]));

        $this->getJson('/api/admin/sales/monthly')->assertStatus(403);
    }

    public function test_monthly_returns_200_for_admin(): void
    {
        // EXTRACT() は PostgreSQL 専用のため SQLite では動かない
        // Railway (PostgreSQL) 環境でのみ実行可能
        $this->markTestSkipped('EXTRACT() は PostgreSQL 専用。SQLite では実行不可。');
    }

    // =========================================
    // 時間帯別売上
    // =========================================

    public function test_hourly_requires_admin(): void
    {
        $this->getJson('/api/admin/sales/hourly')->assertStatus(401);
    }

    public function test_hourly_returns_200_for_admin(): void
    {
        $this->markTestSkipped('EXTRACT() は PostgreSQL 専用。SQLite では実行不可。');
    }

    // =========================================
    // 曜日別売上
    // =========================================

    public function test_weekly_requires_admin(): void
    {
        $this->getJson('/api/admin/sales/weekly')->assertStatus(401);
    }

    public function test_weekly_returns_200_for_admin(): void
    {
        $this->markTestSkipped('EXTRACT() は PostgreSQL 専用。SQLite では実行不可。');
    }
}
