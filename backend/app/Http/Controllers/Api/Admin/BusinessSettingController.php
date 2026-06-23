<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessSetting;
use Illuminate\Http\Request;

class BusinessSettingController extends Controller
{
    public function index()
    {
        $settings = BusinessSetting::all()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'opening_time' => ['required', 'date_format:H:i'],
            'closing_time' => ['required', 'date_format:H:i', 'after:opening_time'],
            'slot_minutes' => ['required', 'integer', 'in:30,60,90,120'],
        ]);

        foreach ($validated as $key => $value) {
            BusinessSetting::set($key, $value);
        }

        return response()->json(['message' => '設定を更新しました。']);
    }
}
