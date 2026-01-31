<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Response;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoomTypeResource;
use App\Http\Requests\StoreRoomTypeRequest;
use App\Http\Requests\UpdateRoomTypeRequest;
use App\Models\RoomType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RoomTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = RoomType::query()
            ->with(['amenities', 'rooms']);

        // filter: status
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        // filter: search (name)
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where('name', 'like', "%{$search}%");
        }

        $roomTypes = $query
            ->orderBy('id', 'desc')
            ->paginate(12)
            ->withQueryString();

        return RoomTypeResource::collection($roomTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRoomTypeRequest $request)
    {
        $data = $request->validated();

        // 1️⃣ 拿出 amenity_ids（不直接进 RoomType 表）
        $amenityIds = $data['amenity_ids'] ?? null;
        unset($data['amenity_ids']);

        // 2️⃣ 处理图片上传（如果有）
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('room-types', 'public');
            $data['image_path'] = $path;

            \Log::info('UPLOAD DEBUG', ['path' => $path, 'data' => $data]);
        }


        // 3️⃣ 创建 RoomType
        $roomType = RoomType::create($data);

        // 4️⃣ 同步 amenities（多对多）
        if (is_array($amenityIds)) {
            $roomType->amenities()->sync($amenityIds);
        }

        // 5️⃣ 预加载关系，给前端完整数据
        $roomType->load(['amenities', 'rooms']);

        return (new RoomTypeResource($roomType))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
    /**
     * Display the specified resource.
     */
    public function show(RoomType $roomType)
    {
        $roomType->load(['amenities', 'rooms']);

        return new RoomTypeResource($roomType);
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoomTypeRequest $request, RoomType $roomType)
    {
        $data = $request->validated();

        // 1️⃣ 拿出 amenity_ids
        $amenityIds = $data['amenity_ids'] ?? null;
        unset($data['amenity_ids']);


        // 情况 1：用户上传了文件（file 优先）
        if ($request->hasFile('image')) {
            if ($roomType->image_path) {
                Storage::disk('public')->delete($roomType->image_path);
            }

            $path = $request->file('image')->store('room-types', 'public');
            $data['image_path'] = $path;
            $data['image_url'] = null;
        }

        // 情况 2：用户没有上传文件，但填写了 image_url
        if (!$request->hasFile('image') && $request->filled('image_url')) {
            if ($roomType->image_path) {
                Storage::disk('public')->delete($roomType->image_path);
            }

            $data['image_path'] = null;          // ⭐ 关键
            $data['image_url'] = $request->input('image_url');
        }
        // 3️⃣ 更新 RoomType 基本字段
        $roomType->update($data);

        // 4️⃣ 同步 amenities
        if (is_array($amenityIds)) {
            $roomType->amenities()->sync($amenityIds);
        }

        // 5️⃣ 重新加载关系
        $roomType->load(['amenities', 'rooms']);

        return new RoomTypeResource($roomType);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RoomType $roomType)
    {
        // 企业规则：如果该房型下还有 rooms，不允许删除
        if ($roomType->rooms()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a room type that still has rooms. Delete rooms first.',
            ], 409);
        }

        $roomType->delete();

        return response()->noContent(); // 204
    }
}
