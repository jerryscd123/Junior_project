"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useAnimation,
  useInView,
  AnimationControls,
} from "framer-motion";
import profile from "@/assets/user.jpg";
import logo from "@/assets/logo9.png"

interface TeamMember {
  id: string;
  number: string;
  name: string;
  role: string;
  description: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    id: "member1",
    number: "01",
    name: "Sochesda Thoeun",
    role: "Lead Team",
    description:
      "A passionate technologist with a deep understanding of software architecture and team dynamics. Known for innovative problem-solving approaches and the ability to bring diverse perspectives together. Has successfully led multiple projects focusing on student engagement and digital community building. Brings 3 years of experience in full-stack development and a strong background in user-centered design.",
    image: "profile",
  },
  {
    id: "member2",
    number: "02",
    name: "Pisethsambo Phok",
    role: "Frontend Developer & Design",
    description:
      "A creative mind with exceptional attention to detail and a deep passion for creating intuitive user experiences. Combines technical expertise with artistic vision to build engaging interfaces. Has contributed to numerous successful digital platforms and brings fresh perspectives to every project. Specializes in responsive design and modern web technologies.",
    image: "profile",
  },
  {
    id: "member3",
    number: "03",
    name: "Se Chanmoniroth",
    role: "Backend Developer",
    description:
      "An analytical thinker with a strong foundation in system architecture and database design. Passionate about building scalable and efficient solutions. Has developed robust backend systems for various educational platforms. Brings expertise in security implementation and data management, ensuring reliable and performant applications.",
    image: "profile",
  },
  {
    id: "member4",
    number: "04",
    name: "Sotheara Em",
    role: "Community & Marketing",
    description:
      "A strategic thinker with a natural ability to connect with people and understand community needs. Brings experience in building and nurturing online communities. Has successfully implemented various engagement strategies and developed meaningful relationships with stakeholders. Passionate about creating inclusive digital spaces for students.",
    image: "profile",
  },
];

export default function TeamSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <div
      ref={sectionRef}
      className="relative w-full py-24 px-4 overflow-hidden bg-white dark:bg-gray-900"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="tree-pattern"
              patternUnits="userSpaceOnUse"
              width="100"
              height="100"
              patternTransform="scale(2) rotate(0)"
            >
              <path
                d="M50,5 L50,95 M30,20 L50,40 M70,20 L50,40 M20,50 L50,80 M80,50 L50,80"
                stroke="#1d2b7d"
                strokeWidth="2"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tree-pattern)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 bg-[#1d2b7d]/10 text-[#1d2b7d] dark:bg-[#1d2b7d]/30 dark:text-[#a3aee2] rounded-full text-sm font-medium mb-4">
              Our Team
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-[#1d2b7d] dark:text-white">
              <span className="relative">
                The Minds Behind
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-[#1d2b7d]/20 dark:bg-[#1d2b7d]/40 z-0"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </span>
              <span className="text-[#1d2b7d] dark:text-[#a3aee2]">
                {" "}
                MindSpeak
              </span>
            </h2>
          </motion.div>

          <motion.p
            className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-lg mt-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Our team works together like branches of a tree, connected and
            supporting each other to create an exceptional platform for
            university students.
          </motion.p>
        </motion.div>

        {/* Tree structure */}
        <div className="relative">
          {/* Root node */}
          <motion.div
            className="w-20 h-20 rounded-full animate-bounce bg-[#1d2b7d] mx-auto flex items-center justify-center shadow-lg shadow-[#1d2b7d]/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Image src={logo} alt="Icon" className="w-25 h-25 object-contain" />
          </motion.div>

          {/* Main trunk */}
          <motion.div
            className="w-1 bg-[#1d2b7d] mx-auto h-24"
            initial={{ height: 0 }}
            animate={{ height: 96 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          ></motion.div>

          {/* First level branch */}
          <div className="relative">
            <TeamMemberBranch
              member={teamMembers[0]}
              index={0}
              controls={controls}
              isRoot={true}
            />

            {/* Second level branches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 bg-[#1d2b7d] h-16"></div>
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-[#1d2b7d]"></div>
              <div className="absolute top-16 left-[10%] w-1 bg-[#1d2b7d] h-16"></div>
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-1 bg-[#1d2b7d] h-16"></div>
              <div className="absolute top-16 left-[90%] w-1 bg-[#1d2b7d] h-16"></div>

              {teamMembers.slice(1).map((member, idx) => (
                <TeamMemberBranch
                  key={member.id}
                  member={member}
                  index={idx + 1}
                  controls={controls}
                  isRoot={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamMemberBranchProps {
  member: TeamMember;
  index: number;
  controls: AnimationControls;
  isRoot: boolean;
}

function TeamMemberBranch({
  member,
  index,
  controls,
  isRoot,
}: TeamMemberBranchProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: index * 0.2,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      className={`${isRoot ? "mx-auto max-w-md" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Card with enhanced styling */}
        <motion.div
          className="relative overflow-hidden rounded-2xl"
          whileHover={{
            y: -8,
            transition: { duration: 0.3 },
          }}
        >
          {/* Card background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white to-[#f5f7ff] dark:from-gray-800 dark:to-gray-900 z-0"></div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1d2b7d]/5 dark:bg-[#1d2b7d]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#1d2b7d]/5 dark:bg-[#1d2b7d]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

          {/* Card content wrapper */}
          <div className="relative z-10 shadow-2xl shadow-[#1d2b7d]/10">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#1d2b7d] to-[#3d4cad]"></div>

            <div className="flex flex-col overflow-hidden">
              {/* Image container */}
              <div className="relative w-full h-64 overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-[#1d2b7d] via-[#1d2b7d]/70 to-transparent z-10"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: isHovered ? 0.8 : 0.6 }}
                  transition={{ duration: 0.3 }}
                />

                <motion.div
                  className="relative h-full w-full"
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.7 }}
                >
                  <Image
                    src={member.image === "profile" ? profile : member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </motion.div>

                {/* Leaf decoration */}
                <motion.div
                  className="absolute top-4 right-4 z-20"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: isHovered ? 15 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2L12 12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 2H22V8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>

                {/* Member info overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 transform translate-y-0">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 + 0.3, duration: 0.5 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="bg-white text-[#1d2b7d] font-bold text-xl w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                      {member.number}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {member.name}
                      </h3>
                      <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full mt-1">
                        {member.role}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-white dark:bg-gray-800">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {member.description}
                </p>


              </div>
            </div>

            {/* Bottom decorative element */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1d2b7d]/10 to-transparent"></div>
          </div>

          {/* Animated highlight on hover */}
          <motion.div
            className="absolute inset-0 border-2 border-[#1d2b7d] rounded-2xl z-20 opacity-0 pointer-events-none"
            animate={{ opacity: isHovered ? 0.3 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
