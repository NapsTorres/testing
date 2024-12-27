-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 16, 2024 at 12:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sport`
--

-- --------------------------------------------------------

--
-- Table structure for table `brackets`
--

CREATE TABLE `brackets` (
  `barcketId` int(11) NOT NULL,
  `sportsId` int(11) DEFAULT NULL,
  `bracketType` varchar(255) NOT NULL,
  `isElimination` tinyint(4) DEFAULT 0,
  `createdAt` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `eventId` int(11) NOT NULL,
  `eventName` longtext NOT NULL,
  `eventYear` int(11) NOT NULL,
  `eventstartDate` date NOT NULL,
  `eventendDate` date NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `description` longtext NOT NULL,
  `createdBy` int(11) NOT NULL,
  `updatedBy` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `matches`
--

CREATE TABLE `matches` (
  `matchId` int(11) NOT NULL,
  `sportEventsId` int(11) DEFAULT NULL,
  `bracketId` int(11) DEFAULT NULL,
  `round` int(11) NOT NULL,
  `team1Id` int(11) UNSIGNED DEFAULT NULL,
  `team2Id` int(11) UNSIGNED DEFAULT NULL,
  `status` enum('scheduled','ongoing','completed','pending') NOT NULL DEFAULT 'pending',
  `winner_team_id` int(11) UNSIGNED NOT NULL,
  `schedule` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `isFinal` tinyint(4) DEFAULT 0,
  `next_match_id` int(11) DEFAULT NULL,
  `loser_next_match_id` int(11) DEFAULT NULL,
  `team1Score` int(11) DEFAULT 0,
  `team2Score` int(11) DEFAULT 0,
  `roundType` enum('round1','quarterfinals','semifinals','finals') DEFAULT NULL,
  `bracketType` enum('winners','losers','final_rematch','final') DEFAULT NULL,
  `eliminationStage` tinyint(4) DEFAULT NULL,
  `venue` longtext DEFAULT NULL,
  `team1stat` varchar(255) DEFAULT NULL,
  `team2stat` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

CREATE TABLE `media` (
  `mediaId` int(11) NOT NULL,
  `url` longtext NOT NULL,
  `type` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `title` longtext DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `players`
--

CREATE TABLE `players` (
  `playerId` int(11) NOT NULL,
  `teamEventId` int(11) DEFAULT NULL,
  `playerName` longtext NOT NULL,
  `position` varchar(255) NOT NULL,
  `medicalCertificate` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sports`
--

CREATE TABLE `sports` (
  `sportsId` int(11) NOT NULL,
  `sportsName` longtext NOT NULL,
  `sportsLogo` longtext NOT NULL,
  `description` longtext NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `createdBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sports`
--

INSERT INTO `sports` (`sportsId`, `sportsName`, `sportsLogo`, `description`, `createdAt`, `createdBy`, `updatedBy`) VALUES
(1, 'Basketball-M', 'https://ik.imagekit.io/ghqmiuwd9/1734347923920_basketball_EKSXn2ZAX.png', '<p>Basketball Men\'s Category</p>', '2024-12-16 11:18:47', 1, NULL),
(2, 'Basketball-W', 'https://ik.imagekit.io/ghqmiuwd9/1734347959856_basketball_7Wqvt5iu_.png', '<p>Basketball Women\'s Category</p>', '2024-12-16 11:19:22', 1, NULL),
(3, 'Volleyball-M', 'https://ik.imagekit.io/ghqmiuwd9/1734347983160_volleyball_SB2jT0GDx.png', '<p>Volleyball Men\'s Category</p>', '2024-12-16 11:19:45', 1, NULL),
(4, 'Volleyball-W', 'https://ik.imagekit.io/ghqmiuwd9/1734348013075_volleyball_Op7XVAw7k.png', '<p>Volleyball Women\'s Category</p>', '2024-12-16 11:20:15', 1, NULL),
(5, 'Badminton-M', 'https://ik.imagekit.io/ghqmiuwd9/1734348071634_image_2024-12-01_094931427-removebg-preview_I-HL-2GcQ.png', '<p>Badminton Men\'s Category</p>', '2024-12-16 11:21:14', 1, 1),
(6, 'Badminton-W', 'https://ik.imagekit.io/ghqmiuwd9/1734348105165_image_2024-12-01_094931427-removebg-preview_Bz5WO1Yl7.png', '<p>Badminton Women\'s Category</p>', '2024-12-16 11:21:47', 1, NULL),
(7, 'Table Tennis-M', 'https://ik.imagekit.io/ghqmiuwd9/1734348131002_image_2024-12-01_095420380-removebg-preview_kokxVohxd.png', '<p>Table Tennis Men\'s Category</p>', '2024-12-16 11:22:13', 1, NULL),
(8, 'Table Tennis-W', 'https://ik.imagekit.io/ghqmiuwd9/1734348156322_image_2024-12-01_095420380-removebg-preview_9nEQKWMlK.png', '<p>Table Tennis Women\'s Category</p>', '2024-12-16 11:22:38', 1, NULL),
(9, 'Sepak Takraw-M', 'https://ik.imagekit.io/ghqmiuwd9/1734348189345_image_2024-11-25_201753916-removebg-preview_arfR3F5JT.png', '<p>Sepak Takraw Men\'s Category</p>', '2024-12-16 11:23:11', 1, NULL),
(10, 'Chess-M', 'https://ik.imagekit.io/ghqmiuwd9/1734348221077_image_2024-12-01_095221190-removebg-preview_2se6GkPsl.png', '<p>Chess Men\'s Category</p>', '2024-12-16 11:23:43', 1, NULL),
(11, 'Chess-W', 'https://ik.imagekit.io/ghqmiuwd9/1734348246856_image_2024-12-01_095221190-removebg-preview_pndQ_DPYe.png', '<p>Chess Women\'s Category</p>', '2024-12-16 11:24:09', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sports_events`
--

CREATE TABLE `sports_events` (
  `sportEventsId` int(11) NOT NULL,
  `sportsId` int(11) DEFAULT NULL,
  `eventsId` int(11) DEFAULT NULL,
  `bracketType` varchar(255) DEFAULT NULL,
  `coachId` int(11) DEFAULT NULL,
  `maxPlayers` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `teamId` int(10) UNSIGNED NOT NULL,
  `teamName` longtext NOT NULL,
  `teamLogo` longtext DEFAULT NULL,
  `teamCoach` int(11) NOT NULL,
  `dateAdded` timestamp NULL DEFAULT current_timestamp(),
  `addedBy` int(11) DEFAULT NULL,
  `updatedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (`teamId`, `teamName`, `teamLogo`, `teamCoach`, `dateAdded`, `addedBy`, `updatedBy`) VALUES
(1, 'College of Computer Study', 'https://ik.imagekit.io/ghqmiuwd9/1734348481101_ccs_knXV7dGHv.png', 3, '2024-12-16 11:28:03', 1, NULL),
(2, 'College of Art and Science', 'https://ik.imagekit.io/ghqmiuwd9/1734348510368_cas_FQ5WcRDVO.jpg', 4, '2024-12-16 11:28:32', 1, NULL),
(3, 'College of Criminal Justice Education', 'https://ik.imagekit.io/ghqmiuwd9/1734348534636_ccje_S20BGfu-q.jpg', 5, '2024-12-16 11:28:57', 1, NULL),
(4, 'College of Teacher Education', 'https://ik.imagekit.io/ghqmiuwd9/1734348560899_cted_MKg1iVOhx.jpg', 6, '2024-12-16 11:29:23', 1, NULL),
(5, 'College of Accountancy and Finance', 'https://ik.imagekit.io/ghqmiuwd9/1734348576229_caf_oYED7MesB.jpg', 7, '2024-12-16 11:29:38', 1, NULL),
(6, 'College of Health Science', 'https://ik.imagekit.io/ghqmiuwd9/1734348597107_chs_90_b9G5mH.jpg', 8, '2024-12-16 11:29:59', 1, NULL),
(7, 'College of Engineering', 'https://ik.imagekit.io/ghqmiuwd9/1734348618565_coe_QVLpytZMm.png', 9, '2024-12-16 11:30:20', 1, NULL),
(8, 'College of Business Management', 'https://ik.imagekit.io/ghqmiuwd9/1734348636391_cbm_N8jl9ZI27.jpg', 10, '2024-12-16 11:30:38', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teams_events`
--

CREATE TABLE `teams_events` (
  `teamEventId` int(11) NOT NULL,
  `sportEventsId` int(11) DEFAULT NULL,
  `teamName` varchar(255) NOT NULL,
  `teamId` int(10) UNSIGNED DEFAULT NULL,
  `coachId` int(11) DEFAULT NULL,
  `teamWin` int(11) DEFAULT 0,
  `teamLose` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` longtext NOT NULL,
  `type` varchar(255) NOT NULL,
  `teamId` int(11) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `addedBy` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `type`, `teamId`, `status`, `addedBy`) VALUES
(1, 'SuperAdmin', '$2y$10$MYhsfPGpO/PmQDho3CS.ausBok58jWQ93iMumRLr3JkqGm22z3z5K', 'SuperAdmin', NULL, 'Active', NULL),
(2, 'Admin', '$2a$10$uFDEBcFw.OYdpPnX0FBvCuVwKTlmI/iqw5K5Jz/x/iJqVnZmu8vYe', 'Admin', NULL, 'Active', 1),
(3, 'CCS', '$2a$10$arDswbpBstjGKlzPfURIAuaMFtRBEJdeH8JVn3I3h.bGCHmHGKdM.', 'Coach', NULL, 'Active', 1),
(4, 'CAS', '$2a$10$.3P2to.JTJ9Y4UE8higzn.WvvxRKoZnMSPVEsyT5W0B4vz95H32PG', 'Coach', NULL, 'Active', 1),
(5, 'CCJE', '$2a$10$SisrhCaDJG7Zv8ApbYBHU.u9ROJGDABY3PBRJj25uJ0UZtzS8CMiW', 'Coach', NULL, 'Active', 1),
(6, 'CTED', '$2a$10$j.x/ns/CaEfLK5Fad9RpQOMer4J4Fhhz8cnLCV0DTIP6zkn7MukYW', 'Coach', NULL, 'Active', 1),
(7, 'CAF', '$2a$10$2EbhKQjTBG3IV.Zms1nTG.uQ6715CesXX9zAODb6f6.42rz5b3Scy', 'Coach', NULL, 'Active', 1),
(8, 'CHS', '$2a$10$K1NGXFoQrYRPw3zjgCGOEu3mivoEOXqKiBzcalZDTqi7hGgh9Jn8y', 'Coach', NULL, 'Active', 1),
(9, 'COE', '$2a$10$z/jN7pV5lywv1r9BCVRYhOkJKiylonUE2mNS/x64diTZn0pbuTzjK', 'Coach', NULL, 'Active', 1),
(10, 'CBM', '$2a$10$nUV2aJDGSODllsq42ipl..8ipLBzQzhESD7AXoy5emklnqRSwoWVi', 'Coach', NULL, 'Active', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `brackets`
--
ALTER TABLE `brackets`
  ADD PRIMARY KEY (`barcketId`),
  ADD KEY `fk_bSprtEv_idx` (`sportsId`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`eventId`),
  ADD KEY `fk_userBy_idx` (`createdBy`),
  ADD KEY `fk_usersID_idx` (`createdBy`),
  ADD KEY `fk_eusers_idx` (`createdBy`,`updatedBy`);

--
-- Indexes for table `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`matchId`),
  ADD KEY `fk_msportEvent_idx` (`sportEventsId`),
  ADD KEY `fk_mteamID_idx` (`team1Id`,`team2Id`),
  ADD KEY `fk_mwinTeam_idx` (`winner_team_id`),
  ADD KEY `fk_mteamID2_idx` (`team2Id`,`winner_team_id`),
  ADD KEY `fk_mBracket_idx` (`bracketId`);

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`mediaId`);

--
-- Indexes for table `players`
--
ALTER TABLE `players`
  ADD PRIMARY KEY (`playerId`),
  ADD KEY `fk_pTeamEv_idx` (`teamEventId`);

--
-- Indexes for table `sports`
--
ALTER TABLE `sports`
  ADD PRIMARY KEY (`sportsId`),
  ADD KEY `fk_sUsers_idx` (`createdBy`);

--
-- Indexes for table `sports_events`
--
ALTER TABLE `sports_events`
  ADD PRIMARY KEY (`sportEventsId`),
  ADD KEY `fk_seEvent_idx` (`eventsId`),
  ADD KEY `fk_seSport_idx` (`sportsId`);

--
-- Indexes for table `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`teamId`),
  ADD KEY `fk_tUsers_idx` (`addedBy`);

--
-- Indexes for table `teams_events`
--
ALTER TABLE `teams_events`
  ADD PRIMARY KEY (`teamEventId`),
  ADD KEY `fk_teTeam_idx` (`teamId`),
  ADD KEY `fk_teUser_idx` (`coachId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `brackets`
--
ALTER TABLE `brackets`
  MODIFY `barcketId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `eventId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `matches`
--
ALTER TABLE `matches`
  MODIFY `matchId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `mediaId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `players`
--
ALTER TABLE `players`
  MODIFY `playerId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sports`
--
ALTER TABLE `sports`
  MODIFY `sportsId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `sports_events`
--
ALTER TABLE `sports_events`
  MODIFY `sportEventsId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `teamId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `teams_events`
--
ALTER TABLE `teams_events`
  MODIFY `teamEventId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `brackets`
--
ALTER TABLE `brackets`
  ADD CONSTRAINT `fk_bSprtEv` FOREIGN KEY (`sportsId`) REFERENCES `sports_events` (`sportEventsId`) ON UPDATE NO ACTION;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `fk_eusers` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE NO ACTION;

--
-- Constraints for table `matches`
--
ALTER TABLE `matches`
  ADD CONSTRAINT `fk_mBracket` FOREIGN KEY (`bracketId`) REFERENCES `brackets` (`barcketId`) ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_mTeam1` FOREIGN KEY (`team1Id`) REFERENCES `teams_events` (`teamId`) ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_mTeam2` FOREIGN KEY (`team2Id`) REFERENCES `teams_events` (`teamId`) ON UPDATE NO ACTION;

--
-- Constraints for table `players`
--
ALTER TABLE `players`
  ADD CONSTRAINT `fk_pTeamEv` FOREIGN KEY (`teamEventId`) REFERENCES `teams_events` (`teamEventId`) ON UPDATE NO ACTION;

--
-- Constraints for table `sports`
--
ALTER TABLE `sports`
  ADD CONSTRAINT `fk_sUsers` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON UPDATE NO ACTION;

--
-- Constraints for table `sports_events`
--
ALTER TABLE `sports_events`
  ADD CONSTRAINT `fk_seEvent` FOREIGN KEY (`eventsId`) REFERENCES `events` (`eventId`) ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_seSport` FOREIGN KEY (`sportsId`) REFERENCES `sports` (`sportsId`) ON UPDATE NO ACTION;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `fk_tUsers` FOREIGN KEY (`addedBy`) REFERENCES `users` (`id`) ON UPDATE NO ACTION;

--
-- Constraints for table `teams_events`
--
ALTER TABLE `teams_events`
  ADD CONSTRAINT `fk_teTeam` FOREIGN KEY (`teamId`) REFERENCES `teams` (`teamId`) ON UPDATE NO ACTION,
  ADD CONSTRAINT `fk_teUser` FOREIGN KEY (`coachId`) REFERENCES `users` (`id`) ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
