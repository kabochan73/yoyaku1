<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ClosedDay>
 */
class ClosedDayFactory extends Factory
{
    // 日付の重複を避けるためにユニーク管理
    private static int $dayOffset = 0;

    public function definition(): array
    {
        self::$dayOffset++;

        return [
            'date'   => now()->addDays(self::$dayOffset)->toDateString(),
            'type'   => $this->faker->randomElement(['regular', 'special', 'national']),
            'reason' => $this->faker->optional()->sentence(),
        ];
    }
}
