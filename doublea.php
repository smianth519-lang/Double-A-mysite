 <?php
   
        $name = htmlspecialchars($_POST['name']);
        $email = htmlspecialchars($_POST['email']);
        $number = htmlspecialchars($_POST['number']);
        $subject = htmlspecialchars($_POST['text']);
        $message = htmlspecialchars($_POST['message']);

       $mailheader = "From:" .$name. "" ."". $email ."". $number ."". $subject .">\r\n";

        $recipient = "doubleawebdesigning@gmail.com";

        if (mail($recipient, $subject, $message, $mailheader)) {
            echo "message sent";
        } else {
            die("Error!");
        }
    
    ?>
