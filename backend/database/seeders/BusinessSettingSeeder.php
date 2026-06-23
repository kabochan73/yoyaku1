<?php

namespace Database\Seeders;

use App\Models\BusinessSetting;
use Illuminate\Database\Seeder;

class BusinessSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'opening_time'  => '09:00',
            'closing_time'  => '23:00',
            'slot_minutes'  => '60',
        ];

        foreach ($settings as $key => $value) {
            BusinessSetting::set($key, $value);
        }
    }
}
