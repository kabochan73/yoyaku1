<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => '管理者',
                'phone'    => '090-0000-0000',
                'password' => 'password',
                'is_admin' => true,
            ]
        );
    }
}
