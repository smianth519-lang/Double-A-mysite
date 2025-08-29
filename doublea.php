 <?php
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $name = $_POST['name'];
        $email = $_POST['email'];
        $number = $_POST['number'];
        $subject = $_POST['subject'];
        $message = $_POST['message'];

        $to = "doubleawebdesigning@gmail.com";
        $subject = "New Form Submission from " . $name;
        $headers = "From: " . $email . "\r\n";
        $headers .= "Reply-To: " . $email . "\r\n";
        $headers .= "Content-type: text/plain; charset=utf-8\r\n";

        mail($to, $subject, $message, $headers);

        echo "Thank you for your submission!";
    }
    ?>