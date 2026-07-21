# BIÊN BẢN HỌP ĐÁNH GIÁ TIẾN ĐỘ & QUY TRÌNH QUẢN LÝ LỖI (BUG)
**Dự án:** Engineering Leadership and Bug Management Process Assessment [77]
**Ngày họp:** 20/07/2026 [75]
**Thời gian:** Sáng ngày 20/07/2026 [75]
**Địa điểm:** Phòng họp nội bộ (Không có thông tin cụ thể trong tài liệu)
**Thành phần tham dự:**
*   **Anh Đạt** (Quản lý cấp cao / Người định hướng) [75, 78]
*   **Chị Huyền** (Team Lead) [75, 77]
*   **Bạn Hồ** (Thành viên nhóm / Tester) [83, 88]
*   **Bạn Hoàng** (Thành viên nhóm / Tester) [83, 88]
*   *Nhân sự liên quan được đề cập trong cuộc họp:* Bạn Huy [87, 91], Bạn Linh [95], Anh Trường [84], Anh An [71].

---

## 1. MỤC TIÊU CUỘC HỌP
*   **Đánh giá tiến độ dự án:** Đánh giá tổng thể tình hình tiến độ công việc trong vòng một tháng qua, đặc biệt tập trung vào kết quả kiểm thử của nhóm trong tuần vừa qua [77].
*   **Tìm giải pháp cải thiện hiệu suất:** Phân tích nguyên nhân khiến các chỉ số hiệu suất chưa đạt kỳ vọng và thảo luận giải pháp khắc phục để đạt được các chỉ số tiệm cận mốc mục tiêu nhất có thể [81, 85].
*   **Thống nhất kế hoạch tuần mới:** Phân bổ nhân sự, tối ưu hóa quy trình kiểm soát chất lượng (review code) và thống nhất kế hoạch triển khai công việc trong tuần tiếp theo [97, 103].

---

## 2. TÓM TẮT NỘI DUNG CHÍNH

### a. Chấn chỉnh vai trò điều phối họp và tác phong làm việc của nhóm
*   **Vai trò điều phối của Team Lead:** Anh Đạt nhắc nhở chị Huyền về vai trò dẫn dắt cuộc họp. Team Lead không được đóng vai trò thụ động như "bồ câu đưa thư" (chỉ chuyển đạt chỉ thị từ trên xuống) [75, 76]. Leader cần chủ động xây dựng chương trình nghị sự (agenda), gửi trước tài liệu cho các bên, nêu rõ mục tiêu và trực tiếp điều phối, định hướng cuộc họp nhằm khẳng định vai trò lãnh đạo [76, 77].
*   **Sắp xếp vị trí và sự tập trung trong phòng họp:** Anh Đạt yêu cầu điều chỉnh lại vị trí ngồi họp của các thành viên để có thể quay sang nhìn nhau song song khi phát biểu [78]. Toàn đội phải tập trung nhìn vào người đang báo cáo/phát biểu thay vì nhìn vào người quản lý (anh Đạt) để tăng tính tương tác và tôn trọng lẫn nhau [78].

### b. Mục tiêu hiệu suất và dữ liệu kiểm thử (Test)
*   **Dữ liệu lịch sử làm căn cứ:** Dựa trên số liệu của các tháng trước (tháng 4, 5, 6), hiệu suất trung bình của cả đội là test được khoảng **60 bugs/ngày** [79].
*   **Mục tiêu hiện tại:** Do dự án mới và nhân sự đang trong giai đoạn làm quen, mục tiêu tháng đầu tiên được đặt ra ở mức vừa phải là **tầm 3 bugs/ngày**, sau đó nâng dần lên **4 đến 5 bugs/ngày** [80].
*   **Thực tế hiệu suất:** Chỉ số hiệu suất thực tế của nhóm trong tuần qua vẫn còn **khá xa mốc mục tiêu đề ra** [81].

### c. Số liệu thống kê lỗi (Bugs) lũy kế (Cộng dồn 3 tuần từ cuối tháng 6)
*   **Tổng số lỗi ghi nhận:** Nhóm đã phát hiện và ghi nhận tổng cộng **70 bugs** [85].
*   **Số lượng lỗi đã triển khai:** Đã có **49 bugs** được sửa đổi, hoàn thiện và triển khai (deploy) hoàn toàn lên hệ thống [86].

### d. Đánh giá hiệu suất cá nhân và tập thể trong tuần qua
*   **Hiệu suất tập thể:** Hiệu suất chung của tuần qua giảm đi khá nhiều so với tuần trước đó [83]. Nguyên nhân chủ yếu là do nhóm phải tập trung nhiều thời gian vào việc review code, dẫn đến thời gian phản hồi (feedback time) bị chậm lại khi mọi người chưa thực sự làm quen [82].
*   **Đánh giá cá nhân:**
    *   **Hoàng:** Năng suất bị ảnh hưởng do được giao test màn hình luồng xử lý (flow) tương đối phức tạp và khó. Trong tuần chỉ mới giải quyết được 2 lỗi liên quan đến flow [83].
    *   **Hồ:** Năng suất làm việc số lượng tốt hơn nhưng kiểm tra chưa kỹ, dẫn đến việc lỗi bị mở lại (reopened) khi tester kiểm tra lại [83, 84]. Đồng thời, Hồ mắc phải lỗi trùng lặp (duplicate bug) với danh sách lỗi đã được anh Trường đưa ra trước đó [84].
    *   **Huy:** Ghi nhận có 13 lỗi phát sinh thực tế trong tuần [91].
*   **Số liệu lỗi thực tế phát sinh trong tuần:**
    *   Sau khi rà soát và loại bỏ hoàn toàn các lỗi không thể tái hiện (not reproducible), sơ bộ ghi nhận có **32 lỗi thực tế phát sinh** (bao gồm: Huy: 13 lỗi, Hoàng: 35 lỗi, Hồ: 36 lỗi) [90, 91, 92].
    *   Tổng số lỗi đã được phân tích xong là khoảng **40 lỗi** [92]. Tỷ lệ lỗi phát sinh chiếm khoảng **1,15% trên tổng số testcase đã thực hiện** (tương đương gần 15 lỗi phát hiện trên mỗi 100 testcase) [92, 93].
    *   Anh Đạt cảnh báo với quy mô 1,500 testcase sắp tới, khối lượng công việc kiểm thử lại (retest) sẽ vô cùng lớn nếu không kiểm soát tốt chất lượng code đầu vào ngay từ khâu review code [93, 94].
*   **Mức độ nghiêm trọng của lỗi:** Trong số 40 lỗi đã phân tích, có **3 lỗi nghiêm trọng liên quan đến hệ thống (lỗi chức năng)** [94, 95]. Các lỗi còn lại chủ yếu là lỗi hiển thị giao diện nhẹ và tài liệu thiết kế (doc) chưa đồng bộ [95]. Anh Đạt yêu cầu tập trung ưu tiên xử lý lỗi chức năng hệ thống trước, các lỗi tài liệu và giao diện nhẹ sẽ tính riêng sau [95, 96].

---

## 3. CÂU HỎI VÀ TRẢ LỜI - VẤN ĐỀ & GIẢI PHÁP ĐƯỢC ĐỀ XUẤT

*   **Vấn đề 1: Giải pháp cải thiện tiến độ kiểm thử và kiểm soát chất lượng code đầu vào?**
    *   *Ý kiến của Hồ:* Đề xuất tăng thêm một nhân sự phụ trách review code để đảm bảo chất lượng và đẩy nhanh tiến độ [88].
    *   *Ý kiến của Hoàng:* Lo ngại việc rút người đi review code sẽ ảnh hưởng tiêu cực đến tiến độ chạy test chung của cả nhóm [88].
    *   *Kết luận của anh Đạt:* Việc **cải tiến quy trình review code** vẫn là yếu tố cốt lõi và bắt buộc. Khi có quy trình review chuẩn, dev sẽ ít mắc các lỗi cơ bản hơn, giải quyết triệt để bài toán chất lượng ngay từ khâu đầu vào thay vì sửa lỗi ở phần ngọn [97, 98].
*   **Vấn đề 2: Quản lý trạng thái bug và kiểm soát các lỗi reopened/tồn đọng?**
    *   *Giải pháp thống nhất:* Cần quản lý chặt chẽ trạng thái của từng bug trên hệ thống [99]. Dev phải tập trung ưu tiên xử lý dứt điểm các lỗi nghiêm trọng (blocker/critical) và các lỗi cũ tồn đọng trước khi chuyển sang giai đoạn test tính năng mới [98, 99, 101].
    *   *Yêu cầu chuyên môn:* Việc phân tích để tìm ra đúng nguyên nhân cốt lõi (root cause) của lỗi là cực kỳ quan trọng đối với sự ổn định hệ thống, tuyệt đối không được đánh giá hời hợt hoặc làm qua loa [104, 105].

---

## 4. HÀNH ĐỘNG CẦN THỰC HIỆN

### Đối với Chị Huyền (Team Lead)
1.  **Rà soát & phân loại lỗi:** Tiếp tục rà soát kỹ danh sách bugs, loại bỏ triệt để lỗi không tái hiện được, hoàn thành phân loại chuẩn xác để dev sửa lỗi nhanh hơn [90, 104, 105]. Đây là task quan trọng nhất cần tập trung làm ngay [105].
2.  **Quản lý Jira:** Thống kê danh sách lỗi chưa assign và chốt phương án phân phối công việc cụ thể cho từng dev trên hệ thống [100].
3.  **Xử lý tài liệu:** Tự mình xử lý các phần việc còn tồn đọng liên quan đến tài liệu [100].
4.  **Tổ chức review chéo:** Phân vai rõ ràng và cụ thể công việc cho Huy, Hoàng, Hồ; hướng dẫn chuyển giao tài liệu test cho nhau để thực hiện các bước kiểm tra chéo (review chéo) testcase nhằm phát hiện sớm các trường hợp test bị thiếu sót [101, 102].
5.  **Hoàn thiện báo cáo:** Hoàn thiện nốt phần số liệu còn thiếu trong **chiều nay (20/07/2026)**, gửi anh Đạt xem qua trước khi chính thức gửi báo cáo cho Ban giám đốc [105].
6.  **Chuẩn bị họp cấp trên:** Tập hợp đầy đủ đống tài liệu báo cáo này lại để chuẩn bị cho buổi họp với Ban giám đốc, đảm bảo số liệu bugs minh bạch và chuẩn xác nhằm phản ánh đúng năng suất nhóm [103, 104].

### Đối với Đội ngũ Phát triển (Dev) & Kiểm thử (Tester)
1.  **Sửa lỗi tồn đọng:** Dev tập trung giải quyết triệt để, dứt điểm lỗi cũ của tuần này trước khi thực hiện test tính năng mới, ưu tiên xử lý lỗi nghiêm trọng trước [98, 99, 101].
2.  **Kiểm tra chéo testcase:** Huy, Hoàng, Hồ tiến hành nhận tài liệu test của nhau và thực hiện các bước kiểm tra chéo theo sự phân công của Huyền [101, 102].
3.  **Đảm bảo số lượng testcase:** Đội ngũ tester phải đảm bảo chạy đúng và bám sát các mục tiêu cụ thể về số lượng testcase hàng ngày [99].

---

## 5. MỤC TIÊU ĐÃ ĐẠT & CẦN TIẾP TỤC

*   **Mục tiêu đã đạt:**
    *   Hoàn thành kế hoạch đề ra cho tuần vừa qua [85].
    *   Đã tiến hành rà soát sơ bộ, loại bỏ các lỗi không liên quan/không tái hiện được và bước đầu phân tích xong khoảng 40 lỗi [90, 92].
    *   Thống nhất được kế hoạch phân bổ công việc và cải tiến quy trình trong tuần mới [103].
*   **Mục tiêu cần tiếp tục:**
    *   Kiểm soát kỹ hơn chất lượng của các bản build trước khi bàn giao cho tester [94].
    *   Duy trì và bám sát các chỉ tiêu về số lượng testcase chạy hàng ngày [99].
    *   Áp dụng hiệu quả quy trình review code mới để giảm thiểu bugs đầu vào [97, 98].

---

## 6. KẾ HOẠCH TIẾP THEO VÀ THỜI HẠN

*   **Chiều ngày 20/07/2026:** Huyền hoàn thành việc cập nhật số liệu báo cáo còn thiếu và gửi Đạt xem trước [105].
*   **Đầu tuần mới:**
    *   Áp dụng quy trình review code mới để nâng cao chất lượng code đầu vào [97, 98].
    *   Đội ngũ dev tập trung xử lý triệt để danh sách lỗi cũ [101].
    *   Nhóm tester (Huy, Hoàng, Hồ) thực hiện chuyển giao tài liệu test và tiến hành review chéo testcase [101, 102].
*   **Chuẩn bị họp Ban giám đốc:** Huyền chuẩn bị sẵn sàng tài liệu báo cáo số liệu bugs minh bạch, chuẩn xác [103, 104].

---

## 7. LỊCH HỌP VÀ TRAO ĐỔI TIẾP THEO
*   Chưa có lịch họp nội bộ cụ thể tiếp theo được ấn định.
*   Huyền chủ động hoàn thành tài liệu báo cáo chiều nay để sẵn sàng cho buổi họp sắp tới với Ban giám đốc [103, 105].
