package com.ex.rubbish.Entity;

import javax.persistence.*;
import java.util.Date;

@Entity
@Table(name = "user_category")
public class UserCategory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "item_name", nullable = false, unique = true)
    private String itemName;
    
    @Column(name = "category", nullable = false)
    private Integer category;
    
    @Column(name = "create_time")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createTime;
    
    // 构造器
    public UserCategory() {
    }
    
    public UserCategory(String itemName, Integer category) {
        this.itemName = itemName;
        this.category = category;
        this.createTime = new Date();
    }
    
    // Getter和Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getItemName() {
        return itemName;
    }
    
    public void setItemName(String itemName) {
        this.itemName = itemName;
    }
    
    public Integer getCategory() {
        return category;
    }
    
    public void setCategory(Integer category) {
        this.category = category;
    }
    
    public Date getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }
}
