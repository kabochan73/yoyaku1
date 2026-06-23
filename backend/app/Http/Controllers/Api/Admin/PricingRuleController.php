<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use Illuminate\Http\Request;

class PricingRuleController extends Controller
{
    public function index()
    {
        return response()->json(PricingRule::orderBy('day_type')->orderBy('start_time')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'day_type'      => ['required', 'in:weekday,weekend,holiday'],
            'start_time'    => ['required', 'date_format:H:i'],
            'end_time'      => ['required', 'date_format:H:i', 'after:start_time'],
            'price_per_hour'=> ['required', 'integer', 'min:0'],
            'is_active'     => ['boolean'],
        ]);

        return response()->json(PricingRule::create($validated), 201);
    }

    public function update(Request $request, PricingRule $pricingRule)
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'day_type'      => ['required', 'in:weekday,weekend,holiday'],
            'start_time'    => ['required', 'date_format:H:i'],
            'end_time'      => ['required', 'date_format:H:i', 'after:start_time'],
            'price_per_hour'=> ['required', 'integer', 'min:0'],
            'is_active'     => ['boolean'],
        ]);

        $pricingRule->update($validated);

        return response()->json($pricingRule);
    }

    public function destroy(PricingRule $pricingRule)
    {
        $pricingRule->delete();

        return response()->json(['message' => '削除しました。']);
    }
}
