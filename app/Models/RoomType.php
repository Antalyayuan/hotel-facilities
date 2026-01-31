<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class RoomType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price_per_night',
        'status',
        'image_url',
        'image_path',
        'max_occupancy',
    ];
    protected static function booted(): void
    {
        static::deleting(function ($roomType) {
            if ($roomType->image_path) {
                Storage::disk('public')->delete($roomType->image_path);
            }
        });
    }


    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function getImageUrlAttribute($value)
    {
        if ($this->image_path) {
            // ✅ 返回相对路径，最稳定
            return '/storage/' . ltrim($this->image_path, '/');
        }

        return $value;
    }


}
