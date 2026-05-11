package com.project.watermonitor.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;


@Entity
@Getter
@Setter
@Table(name = "water_readings")
public class WaterReading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double ph;
    private double turbidity;
    private double tds;
    private double temperature;
    private double flowRate;

    private LocalDateTime timestamp;

    private String status;
    private String alertReason;

    @ManyToOne
    @JoinColumn(name = "pipe_id")
    private Pipe pipe;
}
