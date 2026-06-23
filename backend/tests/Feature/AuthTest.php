<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

// RefreshDatabase：テストのたびにDBをリセットしてくれるトレイト
// これがないと前のテストのデータが残って結果がおかしくなる
class AuthTest extends TestCase
{
    use RefreshDatabase;

    // =========================================
    // 会員登録
    // =========================================

    public function test_register_success(): void
    {
        // Act: APIを叩く
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'テストユーザー',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        // Assert: レスポンスを検証
        $response->assertStatus(201)
                 ->assertJsonStructure(['user', 'token']);

        // DBにもちゃんと保存されているか確認
        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        // Arrange: 同じメールのユーザーを事前に作成
        User::factory()->create(['email' => 'test@example.com']);

        // Act & Assert: 同じメールで登録しようとすると 422（バリデーションエラー）
        $this->postJson('/api/auth/register', [
            'name'                  => '別のユーザー',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_register_fails_when_password_not_confirmed(): void
    {
        // password と password_confirmation が一致しない場合は 422
        $this->postJson('/api/auth/register', [
            'name'                  => 'テストユーザー',
            'email'                 => 'test@example.com',
            'password'              => 'password123',
            'password_confirmation' => 'different_password',
        ])->assertStatus(422);
    }

    // =========================================
    // ログイン
    // =========================================

    public function test_login_success(): void
    {
        // Arrange: ユーザーを作成（factory のデフォルトパスワードは "password"）
        $user = User::factory()->create();

        // Act & Assert: ログイン成功 → 200 + token が返る
        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ])->assertStatus(200)
          ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create();

        // パスワードが違う場合は 422
        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong_password',
        ])->assertStatus(422);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'notexist@example.com',
            'password' => 'password',
        ])->assertStatus(422);
    }

    // =========================================
    // 認証済みエンドポイント
    // =========================================

    public function test_me_returns_authenticated_user(): void
    {
        // Sanctum::actingAs：「このユーザーとしてログイン済み」状態を作る
        // 実際のトークン発行は不要で、テスト内部でユーザーを差し込む
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')
             ->assertStatus(200)
             ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_me_requires_authentication(): void
    {
        // 未ログインで叩くと 401
        $this->getJson('/api/auth/me')
             ->assertStatus(401);
    }

    public function test_logout_success(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/auth/logout')
             ->assertStatus(200)
             ->assertJsonFragment(['message' => 'ログアウトしました。']);
    }
}
