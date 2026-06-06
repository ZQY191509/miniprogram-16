package com.ex.rubbish.Entity.Re;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WasteRecognitionResponse {
    private List<WasteItem> items;
}
