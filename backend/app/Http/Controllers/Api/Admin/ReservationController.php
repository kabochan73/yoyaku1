<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    // 全予約一覧（カレンダー表示用）
    public function index(Request $request)
    {
        $query = Reservation::with('user')->orderBy('start_datetime');

        if ($request->has('date')) {
            $query->whereDate('start_datetime', $request->date);
        }

        if ($request->has('month')) {
            $query->whereYear('start_datetime', substr($request->month, 0, 4))
                  ->whereMonth('start_datetime', substr($request->month, 5, 2));
        }

        return response()->json($query->get());
    }

    // 管理者による予約作成（電話対応）
    public function store(Request $request)
    {
        $validated = $request->validate([
            'start_datetime'  => ['required', 'date'],
            'end_datetime'    => ['required', 'date', 'after:start_datetime'],
            'customer_name'   => ['required', 'string', 'max:255'],
            'customer_phone'  => ['required', 'string', 'max:20'],
            'notes'           => ['nullable', 'string'],
        ]);

        $conflict = Reservation::where(function ($q) use ($validated) {
            $q->where('start_datetime', '<', $validated['end_datetime'])
              ->where('end_datetime', '>', $validated['start_datetime']);
        })->whereNotIn('status', ['cancelled'])->exists();

        if ($conflict) {
            return response()->json(['message' => 'この時間帯はすでに予約が入っています。'], 422);
        }

        $reservation = Reservation::create([
            ...$validated,
            'total_price'        => 0,
            'status'             => 'confirmed',
            'reserved_by_admin'  => true,
        ]);

        return response()->json($reservation, 201);
    }

    // 管理者による予約変更
    public function update(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'start_datetime' => ['required', 'date'],
            'end_datetime'   => ['required', 'date', 'after:start_datetime'],
            'customer_name'  => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'notes'          => ['nullable', 'string'],
            'status'         => ['nullable', 'in:pending,confirmed,cancelled'],
        ]);

        $conflict = Reservation::where('id', '!=', $reservation->id)
            ->where(function ($q) use ($validated) {
                $q->where('start_datetime', '<', $validated['end_datetime'])
                  ->where('end_datetime', '>', $validated['start_datetime']);
            })->whereNotIn('status', ['cancelled'])->exists();

        if ($conflict) {
            return response()->json(['message' => 'この時間帯はすでに予約が入っています。'], 422);
        }

        $reservation->update($validated);

        return response()->json($reservation);
    }

    // 管理者によるキャンセル
    public function cancel(Reservation $reservation)
    {
        $reservation->update(['status' => 'cancelled']);

        return response()->json(['message' => 'キャンセルしました。']);
    }
}
