<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClosedDay;
use Illuminate\Http\Request;

class ClosedDayController extends Controller
{
    public function index()
    {
        return response()->json(ClosedDay::orderBy('date')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'   => ['required', 'date', 'unique:closed_days,date'],
            'type'   => ['required', 'in:regular,special,national'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json(ClosedDay::create($validated), 201);
    }

    public function destroy(ClosedDay $closedDay)
    {
        $closedDay->delete();

        return response()->json(['message' => '削除しました。']);
    }
}
