<?php

namespace App\Http\Responses\Auth;

use App\Services\AuthLandingService;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    public function __construct(
        protected AuthLandingService $landingService,
    ) {
    }

    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        $landing = $this->landingService->resolveFor($request->user());
        $intended = $request->session()->get('url.intended');

        if (
            is_string($intended)
            && $request->user()
            && ! $this->landingService->isSafeIntendedUrl($intended, $request->user())
        ) {
            $request->session()->forget('url.intended');
        }

        return redirect()->intended($landing);
    }
}
