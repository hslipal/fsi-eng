package com.fsieng.practice.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewCardJpaRepository extends JpaRepository<ReviewCardEntity, UUID> {

  Optional<ReviewCardEntity> findByLearnerIdAndCardKey(String learnerId, String cardKey);

  List<ReviewCardEntity> findByLearnerId(String learnerId);
}
