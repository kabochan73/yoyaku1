<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClosedDay extends Model
{
    protected $fillable = [
        'date',
        'type',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
