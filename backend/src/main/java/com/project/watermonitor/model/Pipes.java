package com.project.watermonitor.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.project.watermonitor.model.UsersData;
import com.project.watermonitor.model.Waterpara;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class Pipes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String pipeName; // e.g., "Pipe A"
    private String location; // e.g., "Factory Floor"

   

    // Each pipe belongs to one user
    @ManyToOne
    @JoinColumn(name = "user_id")
    private UsersData user;

    // One pipe has many water readings
    @OneToMany(mappedBy = "pipe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Waterpara> readings;
}