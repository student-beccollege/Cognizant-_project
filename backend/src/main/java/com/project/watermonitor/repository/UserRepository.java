package com.project.watermonitor.repository;


import com.project.watermonitor.model.UsersData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface  UserRepository extends JpaRepository<UsersData,Long>{
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<UsersData>findByUsername(String username);
}
