<?php

namespace Database\Seeders;

use App\Models\PricingRule;
use Illuminate\Database\Seeder;

class PricingRuleSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['name' => '平日・昼間', 'day_type' => 'weekday', 'start_time' => '09:00', 'end_time' => '17:00', 'price_per_hour' => 3000],
            ['name' => '平日・夜間', 'day_type' => 'weekday', 'start_time' => '17:00', 'end_time' => '23:00', 'price_per_hour' => 4000],
            ['name' => '土日・昼間', 'day_type' => 'weekend', 'start_time' => '09:00', 'end_time' => '17:00', 'price_per_hour' => 4500],
            ['name' => '土日・夜間', 'day_type' => 'weekend', 'start_time' => '17:00', 'end_time' => '23:00', 'price_per_hour' => 5000],
            ['name' => '祝日',       'day_type' => 'holiday', 'start_time' => '09:00', 'end_time' => '23:00', 'price_per_hour' => 5000],
        ];

        foreach ($rules as $rule) {
            PricingRule::updateOrCreate(
                ['name' => $rule['name']],
                $rule
            );
        }
    }
}
