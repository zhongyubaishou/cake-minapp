ALTER TABLE `orders`
  MODIFY COLUMN `user_phone` VARCHAR(20) NULL;

ALTER TABLE `delivery_info`
  MODIFY COLUMN `receiver_phone` VARCHAR(20) NULL;

ALTER TABLE `after_sale`
  MODIFY COLUMN `user_phone` VARCHAR(20) NULL;
