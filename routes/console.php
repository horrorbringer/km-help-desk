<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule escalation checks every 15 minutes
Schedule::command('tickets:check-escalations')
    ->everyFifteenMinutes()
    ->withoutOverlapping()
    ->runInBackground();
