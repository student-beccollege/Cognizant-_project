package com.project.watermonitor.repository;

import com.project.watermonitor.model.Waterpara;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaterRepository extends JpaRepository<Waterpara, Long> {

    // Fetch only the most recent entry for the UI status cards
    Optional<Waterpara> findFirstByUserIdOrderByTimestampDesc(Long userId);

    // Fetch all history for the user (useful for line charts)
    List<Waterpara> findByUserIdOrderByTimestampAsc(Long userId);
}