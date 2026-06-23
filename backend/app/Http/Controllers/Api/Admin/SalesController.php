<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    // 月別売上
    public function monthly(Request $request)
    {
        $year = $request->get('year', now()->year);

        $data = Reservation::whereNotIn('status', ['cancelled'])
            ->whereYear('start_datetime', $year)
            ->select(
                DB::raw('EXTRACT(MONTH FROM start_datetime) as month'),
                DB::raw('SUM(total_price) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json($data);
    }

    // 時間帯別売上
    public function hourly(Request $request)
    {
        $year  = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        $data = Reservation::whereNotIn('status', ['cancelled'])
            ->whereYear('start_datetime', $year)
            ->whereMonth('start_datetime', $month)
            ->select(
                DB::raw('EXTRACT(HOUR FROM start_datetime) as hour'),
                DB::raw('SUM(total_price) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json($data);
    }

    // 曜日別売上
    public function weekly(Request $request)
    {
        $year  = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        $data = Reservation::whereNotIn('status', ['cancelled'])
            ->whereYear('start_datetime', $year)
            ->whereMonth('start_datetime', $month)
            ->select(
                DB::raw('EXTRACT(DOW FROM start_datetime) as day_of_week'),
                DB::raw('SUM(total_price) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('day_of_week')
            ->orderBy('day_of_week')
            ->get();

        return response()->json($data);
    }
}
