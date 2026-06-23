<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\Admin;
use Illuminate\Support\Facades\Route;

// 認証不要
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/reservations/availability', [ReservationController::class, 'availability']);
Route::get('/pricing-rules', [Admin\PricingRuleController::class, 'index']);
Route::get('/business-settings', [Admin\BusinessSettingController::class, 'index']);
Route::get('/closed-days', [Admin\ClosedDayController::class, 'index']);

// 認証必要（ユーザー）
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'index']);
        Route::post('/', [ReservationController::class, 'store']);
        Route::put('/{reservation}', [ReservationController::class, 'update']);
        Route::patch('/{reservation}/cancel', [ReservationController::class, 'cancel']);
    });
});

// 認証必要（管理者）
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // 予約管理
    Route::get('/reservations', [Admin\ReservationController::class, 'index']);
    Route::post('/reservations', [Admin\ReservationController::class, 'store']);
    Route::put('/reservations/{reservation}', [Admin\ReservationController::class, 'update']);
    Route::patch('/reservations/{reservation}/cancel', [Admin\ReservationController::class, 'cancel']);

    // 料金設定
    Route::post('/pricing-rules', [Admin\PricingRuleController::class, 'store']);
    Route::put('/pricing-rules/{pricingRule}', [Admin\PricingRuleController::class, 'update']);
    Route::delete('/pricing-rules/{pricingRule}', [Admin\PricingRuleController::class, 'destroy']);

    // 定休日設定
    Route::post('/closed-days', [Admin\ClosedDayController::class, 'store']);
    Route::delete('/closed-days/{closedDay}', [Admin\ClosedDayController::class, 'destroy']);

    // 営業設定
    Route::put('/business-settings', [Admin\BusinessSettingController::class, 'update']);

    // 売上分析
    Route::get('/sales/monthly', [Admin\SalesController::class, 'monthly']);
    Route::get('/sales/hourly', [Admin\SalesController::class, 'hourly']);
    Route::get('/sales/weekly', [Admin\SalesController::class, 'weekly']);

    // ユーザー一覧
    Route::get('/users', [Admin\UserController::class, 'index']);
});
