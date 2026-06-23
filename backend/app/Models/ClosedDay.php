<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClosedDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'type',
        'reason',
    ];

    // date は常に Y-m-d 形式で保存する（Y-m-d H:i:s にならないよう明示）
    // こうしないと unique:closed_days,date バリデーションが
    // '2026-08-15' vs '2026-08-15 00:00:00' で不一致になる
    protected function date(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value) : null,
            set: fn ($value) => Carbon::parse($value)->toDateString(),
        );
    }
}
