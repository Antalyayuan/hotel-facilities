<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Amenity;

class AmenityController extends Controller
{
    public function index()
    {
        return Amenity::query()->orderBy('name')->get(['id','name','icon']);
    }
}
