INSERT INTO llm_trainings (model_type, state, trained_date, file_name, version_number, image_version, test_report, created)
VALUES (:model_type, :state, CURRENT_TIMESTAMP, :file_name, :version_number , :image_version, :test_report::JSONB, CURRENT_TIMESTAMP);