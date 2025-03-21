interface User {
    id: string;
    phone: string;
    name: string;
}

interface Group {
    id: string;
    name: string;
    members: string[];
}

let users: User[] = [];
let groups: Group[] = [];