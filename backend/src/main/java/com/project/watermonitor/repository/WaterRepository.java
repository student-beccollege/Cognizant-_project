package com.project.watermonitor.repository;

import com.project.watermonitor.model.Waterpara;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaterRepository extends JpaRepository<Waterpara, Long> {

    Optional<Waterpara> findFirstByPipeIdOrderByTimestampDesc(Long pipeId);

    List<Waterpara> findByPipeIdOrderByTimestampAsc(Long pipeId);

    List<Waterpara> findTop20ByPipeUserIdAndStatusNotOrderByTimestampDesc(Long userId, String status);
}
