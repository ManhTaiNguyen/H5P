# H5P.DragNDrop Integration

## Tổng quan
Dự án này đã được tích hợp thư viện H5P.DragNDrop để thay thế logic kéo thả tự viết ban đầu.

## Files đã thay đổi

### 1. script.js
- **Đã loại bỏ**: Tất cả logic kéo thả tự viết (jQuery UI Draggable/Droppable)
- **Đã thêm**: Tích hợp H5P.DragNDrop library
- **Phương thức mới**:
  - `initializeDragNDrop()`: Khởi tạo H5P.DragNDrop
  - `prepareDragNDropParams()`: Chuẩn bị tham số từ content.json
  - `setupDragNDropEvents()`: Thiết lập event listeners
  - `updateScore()`: Cập nhật điểm số từ H5P
  - `resetState()`: Reset trạng thái

### 2. index.html (đã cập nhật)
- **Đã thêm**: H5P Core và DragNDrop library scripts
- **Đã loại bỏ**: Các nút check/solution/retry cũ (H5P sẽ tự tạo)

### 3. demo-h5p.html (mới)
- File demo mới sử dụng H5P.DragNDrop
- Giao diện đơn giản hơn, H5P tự quản lý UI

## Cách sử dụng

### Phiên bản gốc (logic tự viết)
```bash
# Mở file index-original.html (nếu có backup)
```

### Phiên bản H5P tích hợp
```bash
# Mở file demo-h5p.html
```

## Lợi ích của việc tích hợp H5P.DragNDrop

1. **Chuẩn hóa**: Sử dụng thư viện H5P được chuẩn hóa
2. **Bảo trì**: Giảm code tự viết, dễ bảo trì hơn
3. **Tính năng**: H5P cung cấp nhiều tính năng built-in
4. **Accessibility**: H5P hỗ trợ accessibility tốt hơn
5. **Cross-platform**: Hoạt động tốt trên nhiều thiết bị

## Cấu trúc dữ liệu

H5P.DragNDrop sử dụng cấu trúc tham số chuẩn:
```javascript
{
  question: {
    settings: { size: { width, height } },
    task: {
      elements: [...], // draggable elements
      dropZones: [...] // drop zones
    }
  },
  behaviour: {
    enableRetry: true,
    enableSolutionsButton: true,
    enableCheckButton: true
  },
  l10n: { ... } // localization
}
```

## Ghi chú
- File content.json vẫn được sử dụng làm nguồn dữ liệu
- Các tham số được chuyển đổi tự động sang format H5P
- H5P tự động xử lý responsive design và mobile support