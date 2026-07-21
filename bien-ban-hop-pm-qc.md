# BIÊN BẢN HỌP: QUẢN TRỊ DỰ ÁN VÀ KIỂM SOÁT CHẤT LƯỢNG SỬA BUG

- **Thời gian**: [Chưa có thông tin cụ thể]
- **Địa điểm**: [Chưa có thông tin cụ thể]
- **Thành phần tham dự**: Anh Đạt, Chị Huyền [1, 41, 49, 59]

---

### 1. Mục Tiêu Cuộc Họp
- **Xác định mục tiêu và kế hoạch xử lý bug** của team [2].
- **Đào tạo năng lực, tư duy quản lý** (Mindset quản lý) cho Chị Huyền về các hoạt động: Lập kế hoạch (Plan), Kiểm soát (Control), Tổ chức (Organize), Dẫn dắt (Lead) và xây dựng Báo cáo số liệu (Report) để định hình tư duy quản lý dự án một cách chuyên nghiệp, tránh cách làm việc đại khái [3, 4, 14, 21, 22, 29, 30, 62].

---

### 2. Tóm Tắt Nội Dung Chính

#### a. Tư duy quản lý dự án (Plan - Control - Organize - Lead) [3, 4]
- **Plan (Lập kế hoạch)**: Tập trung vào xác định mục tiêu, kế hoạch xử lý bug, phân loại ưu tiên dựa trên mức độ ảnh hưởng và deadline, điều phối công việc để đảm bảo mỗi bug đều có người chịu trách nhiệm (owner) rõ ràng [2, 3].
- **Control (Kiểm soát)**: Theo dõi sát sao tiến độ xử lý bug, cập nhật tình hình thực tế, review hỗ trợ lập trình viên (dev) để tháo gỡ khó khăn (unblock) kịp thời [2, 3, 4].
- **Organize (Tổ chức)**: Quản lý task, quản lý con người và thiết lập quy trình (Process) sửa bug cho team (phối hợp nhịp nhàng với quy trình chung của dự án) [4, 5]. Một quy trình fix bug tiêu chuẩn cần xác định rõ [6]:
    - *Đầu vào (Input)*: Log defect chi tiết trên Notion, các chỉ thị (phương pháp sửa, độ ưu tiên, deadline) rút ra từ cuộc họp, tài liệu nghiệp vụ, tài liệu thiết kế kỹ thuật và tài liệu quy trình [7, 8, 9].
    - *Đầu ra (Output)*: Code đã sửa, môi trường chạy thử nghiệm (environment), và checklist nghiệm thu để đảm bảo làm đúng chuẩn [15].
- **Lead (Dẫn dắt)**: Định hướng, onboarding thành viên mới, phân công đầu việc, hướng dẫn đọc tài liệu [18]. Điều chỉnh và dẫn dắt nhân sự tự giải quyết vấn đề, tự học hỏi để nhớ lâu thay vì làm hộ [20, 21].

#### b. Năng lực ước lượng nỗ lực (Estimate) [14]
- Là năng lực cốt lõi cực kỳ quan trọng của người quản lý khi cần trả lời câu hỏi "Bao giờ xong?" [14].
- Ước lượng có nhiều cấp độ chính xác tăng dần: Khái quát (~20%), Khái lược (~70%), và Triển khai thực thi (~80%) [10]. Sử dụng đơn vị công sức Man-Month (MM) hoặc Man-Day (MD) nhân với đơn giá chi phí để quyết định giải pháp tối ưu về mặt kinh tế [11, 12, 13, 56].

#### c. Kiểm soát chất lượng (Quality Control) [22]
- Sửa lỗi phải đi đôi với đảm bảo chất lượng, phê bình tư duy "chỉ đâm đầu chạy tiến độ cho xong" mà thiếu kiểm soát chất lượng [22].
- Xác định rõ người chịu trách nhiệm chất lượng trong team để tránh tranh cãi [23].
- Yêu cầu bắt buộc lập trình viên phải đưa ra phương án sửa bug trước khi thực hiện để đảm bảo đi đúng hướng [25, 26]. Áp dụng cơ chế họp Agile hàng ngày vào buổi sáng để kiểm soát công việc [27].

#### d. Phương pháp xây dựng Báo cáo số liệu (Report) [30]
- Báo cáo chuẩn chỉ phải chứa đựng **Kết luận** (cái gì tốt, cái gì xấu, cái gì có vấn đề bất thường) chứ không chỉ đơn thuần là liệt kê số liệu thô [30, 33].
- Quản lý bằng số liệu là để tìm ra những **điểm bất thường (abnormal)**, từ đó đưa ra quyết định điều phối tài nguyên (tăng/giảm người, bớt task, lùi deadline hoặc thay đổi độ ưu tiên) [34, 35, 36].
- Phân bổ nỗ lực (effort) tiêu chuẩn của Leader một ngày (8 tiếng) gồm: 5% cho quản lý (~1.2 giờ), 20% cho việc review/check (~1.6 giờ), phần thời gian còn lại (~5 giờ) dùng để trực tiếp fix bug [59, 60, 61].
- Dùng dữ liệu lịch sử sửa bug của thành viên cũ (như An fix 80 lỗi trong tháng 5, 135 lỗi trong tháng 6) làm mốc tham chiếu thực tế để giúp các thành viên mới đo lường năng lực hiện tại và đặt mục tiêu lộ trình tiến bộ theo thời gian (1, 2 hoặc 3 tháng) [67, 68, 70, 71, 72].

---

### 3. Câu hỏi và Trả lời - Vấn Đề & Giải Pháp Được Đề Xuất

- **Vấn đề 1: Trang thống kê riêng bị phức tạp hóa.**
    - *Giải pháp*: Đối với dữ liệu đơn giản, chỉ cần khóa dữ liệu lại và chụp ảnh màn hình báo cáo, tránh phức tạp hóa vấn đề không cần thiết [2].
- **Vấn đề 2: Dữ liệu tên nhân sự viết hoa/thường không nhất quán (ví dụ: Xuân Hồng Nguyễn).**
    - *Giải pháp*: Cần chuẩn hóa chi tiết. Dù là nội bộ nhưng nếu báo cáo cho các đối tác đòi hỏi tính chuẩn chỉ cao (như khách hàng Nhật Bản), họ sẽ đánh giá quy trình kiểm soát tiêu chuẩn và kiểm soát lỗi của team rất tùy tiện [38, 39].
- **Vấn đề 3: Sự chênh lệch lớn về năng suất và chất lượng sửa lỗi giữa các dev mới (Hồ làm được 10 bug nhưng tỉ lệ Re-open cao 12.0; Hoàng làm được 3-4 bug nhưng tỉ lệ comment trao đổi nhiều) [40, 41, 51, 55].**
    - *Giải pháp*:
        - Đối với Hồ: Cần phân tích nguyên nhân gốc rễ (root cause) dẫn đến tỷ lệ Re-open cao (sửa sai hướng) để đưa ra hành động khắc phục cụ thể [50].
        - Đối với Hoàng: Chất lượng sửa còn kém, cần theo dõi số liệu tỷ lệ comment theo tuần/tháng để kiểm chứng chất lượng và sự tiến bộ sau này [51, 52].
- **Vấn đề 4: Tính sai lệch số liệu hiệu suất do nhồi nhét các bug trùng lặp hoặc không cần xử lý vào cột "Tổng nhận".**
    - *Giải pháp*: Những bug trùng lặp hoặc không phải xử lý thì phải hủy (cancel) ngay từ đầu để tránh làm sai lệch nỗ lực (effort) thực tế của nhân sự [53, 54, 55].
- **Vấn đề 5: Thiếu tính logic trong trạng thái của bug và thẩm quyền đóng (close) bug.**
    - *Giải pháp*: Thống nhất quy trình chuyển đổi trạng thái của bug (Wait -> Assign -> Doing -> Chờ review -> Done) [45]. Xác định rõ thẩm quyền close bug (chỉ định rõ cái nào Chị Huyền được quyền close, cái nào cần Trường xác nhận) [48].

---

### 4. Hành Động Cần Thực Hiện

- **Chị Huyền thực hiện**:
    - **Phân rã (break out) mô tả công việc chung chung** thành các đầu việc và hành động cụ thể cho từng vai trò [3].
    - **Thiết lập và viết tài liệu quy trình (Process) fix bug rõ ràng** bao gồm Input, Output và Checklist nghiệm thu [15].
    - **Cập nhật lại bảng số liệu báo cáo**: Chuẩn hóa tên nhân sự, lọc bỏ các bug trùng lặp, bổ sung cột nỗ lực công việc (Effort tính theo Man-Day) để tính toán hiệu suất thực tế [38, 54, 56, 57].
    - **Vẽ biểu đồ số liệu (chart)** theo tuần và tháng để dễ dàng quan sát các biến động bất thường [56, 63].
    - **Xác định cụ thể năng lực yếu của từng member** (Hoàng, Hồ, Huy) và đề ra phương án hướng dẫn cải tiến hiệu suất cho từng người trong tuần tiếp theo [64].
    - **Thực hiện lích ngược (Lead ngược)**: Chủ động đề xuất các yêu cầu về bổ sung nhân sự, tài nguyên lên cấp trên để giải quyết mục tiêu [65].
    - **Lên lịch họp hàng ngày** để duy trì tinh thần Agile (Sáng nay làm gì? Đã làm được gì? Có vấn đề gì không?) nhằm dẫn dắt định hướng kỹ thuật cho team [27].
    - **Tổ chức họp team cuối tuần** để truyền thông nhận thức, đánh giá báo cáo tuần và triển khai cải thiện hiệu suất [63].

---

### 5. Mục Tiêu Đã Đạt & Cần Tiếp Tục

- **Mục tiêu đã đạt**:
    - Bước đầu xây dựng được trang thống kê và thu thập số liệu hiệu suất cơ bản của team trong 2-3 tuần làm việc đầu tiên [1, 47, 49].
- **Mục tiêu cần tiếp tục**:
    - Chuyển đổi tư duy từ "chỉ đâm đầu chạy tiến độ" sang "ưu tiên kiểm soát chất lượng" [22].
    - Hoàn thiện tính chuẩn chỉ và chuyên nghiệp của báo cáo (báo cáo phải có kết luận rõ ràng, phát hiện được các điểm bất thường) [30, 34].
    - Cải thiện năng suất và chất lượng sửa lỗi của các lập trình viên mới hướng tới mốc năng suất tham chiếu [70, 71].

---

### 6. Kế Hoạch Tiếp Theo Và Thời Hạn

- **Kế hoạch**:
    - Chị Huyền chuẩn hóa báo cáo số liệu và thiết lập biểu đồ [63].
    - Lên lịch họp team (họp với member) để thống nhất mục tiêu cải thiện năng suất, chất lượng cho từng cá nhân [63, 64].
- **Thời hạn**: [Chưa có thông tin cụ thể]

---

### 7. Lịch Họp Và Trao Đổi Tiếp Theo (nếu có)
- Chị Huyền lên lịch họp team để phổ biến và đúc kết các nội dung cải tiến sau cuộc họp này [63, 73].
- [Thời gian cụ thể chưa được xác định]
