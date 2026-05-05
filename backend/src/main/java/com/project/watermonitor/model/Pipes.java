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

    public UsersData getUser() {
        return user;
    }

    public void setUser(UsersData user) {
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPipeName() {
        return pipeName;
    }

    public void setPipeName(String pipeName) {
        this.pipeName = pipeName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public List<Waterpara> getReadings() {
        return readings;
    }

    public void setReadings(List<Waterpara> readings) {
        this.readings = readings;
    }

    // Each pipe belongs to one user
    @ManyToOne
    @JoinColumn(name = "user_id")
    private UsersData user;

    // One pipe has many water readings
    @OneToMany(mappedBy = "pipe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Waterpara> readings;
}