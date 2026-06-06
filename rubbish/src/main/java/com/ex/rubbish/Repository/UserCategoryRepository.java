package com.ex.rubbish.Repository;

import com.ex.rubbish.Entity.UserCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface UserCategoryRepository extends JpaRepository<UserCategory, Long> {
    
    // 根据物品名称查询分类
    UserCategory findByItemName(String itemName);
    
    // 检查物品名称是否存在
    boolean existsByItemName(String itemName);
}
