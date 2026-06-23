<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    // 空き状況確認（日付指定）
    public function availability(Request $request)
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        $reservations = Reservation::whereDate('start_datetime', $request->date)
            ->whereNotIn('status', ['cancelled'])
            ->get(['id', 'start_datetime', 'end_datetime']);

        return response()->json($reservations);
    }

    // マイページ：自分の予約一覧
    public function index(Request $request)
    {
        $reservations = $request->user()
            ->reservations()
            ->orderBy('start_datetime', 'desc')
            ->get();

        return response()->json($reservations);
    }

    // 予約作成
    public function store(Request $request)
    {
        $validated = $request->validate([
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime'   => ['required', 'date', 'after:start_datetime'],
        ]);

        // 重複チェック
        $conflict = Reservation::where(function ($q) use ($validated) {
            $q->where('start_datetime', '<', $validated['end_datetime'])
              ->where('end_datetime', '>', $validated['start_datetime']);
        })->whereNotIn('status', ['cancelled'])->exists();

        if ($conflict) {
            return response()->json(['message' => 'この時間帯はすでに予約が入っています。'], 422);
        }

        $reservation = $request->user()->reservations()->create([
            'start_datetime' => $validated['start_datetime'],
            'end_datetime'   => $validated['end_datetime'],
            'total_price'    => 0, // 料金計算は後で実装
            'status'         => 'confirmed',
        ]);

        return response()->json($reservation, 201);
    }

    // 予約変更
    public function update(Request $request, Reservation $reservation)
    {
        if ($reservation->user_id !== $request->user()->id) {
            return response()->json(['message' => '権限がありません。'], 403);
        }

        $validated = $request->validate([
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime'   => ['required', 'date', 'after:start_datetime'],
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

    // キャンセル
    public function cancel(Request $request, Reservation $reservation)
    {
        if ($reservation->user_id !== $request->user()->id) {
            return response()->json(['message' => '権限がありません。'], 403);
        }

        $reservation->update(['status' => 'cancelled']);

        return response()->json(['message' => 'キャンセルしました。']);
    }
}
