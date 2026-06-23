<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('is_admin', false)
            ->withCount('reservations')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }
}
