package com.ex.rubbish.Entity.Re;

import lombok.Data;
import java.util.List;

//识别功能
//输入实体{
//  "text": "用户输入的文字",
//  "images": ["wxfile://tmp_xxx.jpg", "wxfile://tmp_yyy.jpg"]
//}

@Data
public class WasteRecognitionRequest {
    private String text;
    private List<String> images;
}
