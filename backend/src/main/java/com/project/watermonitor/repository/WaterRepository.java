package com.project.watermonitor.repository;

import com.project.watermonitor.model.WaterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaterRepository extends JpaRepository<WaterReading, Long> {

    Optional<WaterReading> findFirstByPipeIdOrderByTimestampDesc(Long pipeId);

    List<WaterReading> findByPipeIdOrderByTimestampAsc(Long pipeId);

    List<WaterReading> findTop20ByPipeUserIdAndStatusNotOrderByTimestampDesc(Long userId, String status);
}
