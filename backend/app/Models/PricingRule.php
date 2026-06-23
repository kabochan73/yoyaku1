<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    protected $fillable = [
        'name',
        'day_type',
        'start_time',
        'end_time',
        'price_per_hour',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'price_per_hour' => 'integer',
        ];
    }
}
