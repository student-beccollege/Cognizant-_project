package com.project.watermonitor.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;


@Entity
@Data
public class Waterpara {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double ph;
    private double turbidity;
    private double tds;
    private String status; // "SAFE" or "DANGER"
    private LocalDateTime timestamp;

   

    // Each reading belongs to one specific pipe
    @ManyToOne
    @JoinColumn(name = "pipe_id")
    private Pipes pipe;
}
