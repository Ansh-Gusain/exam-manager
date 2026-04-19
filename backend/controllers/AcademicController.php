<?php
require_once __DIR__ . '/../helpers/response.php';

class AcademicController {
    private array $schools = [
        'SOICT'  => 'School of ICT',
        'SOM'    => 'School of Management',
        'SOBT'   => 'School of Biotechnology',
        'SOLJG'  => 'School of Law, Justice & Governance',
        'SOVSAS' => 'School of Vocational Studies & Applied Sciences',
        'SOHSS'  => 'School of Humanities & Social Sciences',
        'SOE'    => 'School of Engineering',
    ];

    private array $departmentsBySchool = [
        'SOICT'  => ['CSE', 'ECE', 'IT'],
        'SOM'    => ['Management'],
        'SOBT'   => ['BT'],
        'SOLJG'  => ['Law'],
        'SOVSAS' => ['CH', 'ES', 'FT', 'MA', 'PH'],
        'SOHSS'  => ['Humanities', 'Social Sciences'],
        'SOE'    => ['Mechanical', 'Civil', 'Electrical'],
    ];

    private array $branchesByDepartment = [
        'CSE'            => ['BCS', 'CSE-AI', 'CSE-ML', 'CSE-DS'],
        'ECE'            => ['B.Tech ECE', 'ECE-VLSI'],
        'IT'             => ['B.Tech IT', 'IT-Cloud'],
        'Management'     => ['BBA', 'MBA'],
        'BT'             => ['B.Tech Biotech', 'M.Tech Biotech'],
        'Law'            => ['BA LLB', 'BBA LLB'],
        'CH'             => ['B.Sc Chemistry', 'M.Sc Chemistry'],
        'ES'             => ['B.Sc Environmental Sciences', 'M.Sc Environmental Sciences'],
        'FT'             => ['B.Sc Food Technology', 'M.Sc Food Technology'],
        'MA'             => ['B.Sc Mathematics', 'M.Sc Mathematics'],
        'PH'             => ['B.Sc Physics', 'M.Sc Physics'],
        'Humanities'     => ['BA English', 'BA Hindi', 'MA English'],
        'Social Sciences'=> ['BA Political Science', 'BA Economics'],
        'Mechanical'     => ['B.Tech ME', 'M.Tech ME'],
        'Civil'          => ['B.Tech CE', 'M.Tech CE'],
        'Electrical'     => ['B.Tech EE', 'M.Tech EE'],
    ];

    public function schools(array $params): void {
        $result = [];
        foreach ($this->schools as $code => $name) {
            $result[] = ['code' => $code, 'name' => $name];
        }
        jsonResponse($result);
    }

    public function departments(array $params): void {
        $q      = getQuery();
        $school = $q['school'] ?? null;

        if ($school) {
            $depts = $this->departmentsBySchool[$school] ?? [];
            jsonResponse($depts);
        }

        jsonResponse($this->departmentsBySchool);
    }

    public function branches(array $params): void {
        $q    = getQuery();
        $dept = $q['department'] ?? null;

        if ($dept) {
            $branches = $this->branchesByDepartment[$dept] ?? [];
            jsonResponse($branches);
        }

        jsonResponse($this->branchesByDepartment);
    }

    public function fullStructure(array $params): void {
        $structure = [];
        foreach ($this->schools as $schoolCode => $schoolName) {
            $school = ['code' => $schoolCode, 'name' => $schoolName, 'departments' => []];
            foreach ($this->departmentsBySchool[$schoolCode] ?? [] as $dept) {
                $school['departments'][] = [
                    'code'     => $dept,
                    'branches' => $this->branchesByDepartment[$dept] ?? [],
                ];
            }
            $structure[] = $school;
        }
        jsonResponse($structure);
    }
}
