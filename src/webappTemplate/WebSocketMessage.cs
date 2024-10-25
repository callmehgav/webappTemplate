using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace webappTemplate
{
    // Define the message structure
    public class WebSocketMessage
    {
        public String Type { get; set; }
        public String Payload { get; set; }
    }
}
