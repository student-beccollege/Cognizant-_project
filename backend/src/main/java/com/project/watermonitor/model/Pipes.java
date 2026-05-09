package com.project.watermonitor.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class Pipes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String pipeName;
    private String location;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UsersData user;

    @OneToMany(mappedBy = "pipe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Waterpara> readings;
}
